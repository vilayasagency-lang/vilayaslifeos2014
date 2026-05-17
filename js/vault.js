document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    loadVaultFiles(user.id);
    updateStorageStats(user.id);

    // --- File Upload Logic ---
    const fileInput = document.getElementById('vault-upload-input');
    fileInput.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        for (let file of files) {
            await uploadFileToR2(file, user.id);
        }
        loadVaultFiles(user.id); // Refresh list
    });
});

// 1. Upload File Logic
async function uploadFileToR2(file, userId) {
    try {
        const statusText = document.getElementById('storage-used');
        statusText.innerText = `Uploading ${file.name}...`;

        // Step A: Get Signed URL from Cloudflare Worker (via api.js)
        const { uploadUrl, fileKey } = await api.getUploadUrl(file.name, file.type, 'vault-files');

        // Step B: Upload directly to R2 using PUT
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        if (!uploadResponse.ok) throw new Error("R2 Upload Failed");

        // Step C: Record metadata in Supabase
        const { error } = await supabase.from('vault_files').insert([{
            user_id: userId,
            file_name: file.name,
            file_key: fileKey,
            file_size: file.size,
            file_type: file.type,
            category: 'other'
        }]);

        if (error) throw error;
        console.log(`${file.name} secured in Vault.`);

    } catch (err) {
        alert("Upload Error: " + err.message);
    }
}

// 2. Load Files from Supabase
async function loadVaultFiles(userId) {
    const container = document.getElementById('vault-files-container');
    
    const { data: files, error } = await supabase
        .from('vault_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return;

    if (files.length === 0) {
        container.innerHTML = '<div class="empty-state">No documents found. Start by uploading one.</div>';
        return;
    }

    container.innerHTML = files.map(file => `
        <div class="card file-card fade-in">
            <div class="file-icon">${getFileIcon(file.file_type)}</div>
            <div class="file-info">
                <h4 title="${file.file_name}">${truncateName(file.file_name)}</h4>
                <p>${(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <div class="file-actions">
                <button onclick="downloadFile('${file.file_key}')" class="btn-icon">⬇️</button>
                <button onclick="deleteFile('${file.id}', '${file.file_key}')" class="btn-icon">🗑️</button>
            </div>
        </div>
    `).join('');
}

// 3. Delete File Logic
async function deleteFile(dbId, fileKey) {
    if (!confirm("Are you sure you want to delete this file permanently?")) return;

    // Remove from Supabase
    const { error } = await supabase.from('vault_files').delete().eq('id', dbId);
    
    // Note: In a production app, you should also trigger a Worker to delete from R2
    // await api.deleteFromR2(fileKey); 

    if (!error) location.reload();
}

// --- Utilities ---
function getFileIcon(type) {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('text')) return '📝';
    return '📁';
}

function truncateName(name) {
    return name.length > 20 ? name.substring(0, 17) + "..." : name;
}

async function updateStorageStats(userId) {
    const { data } = await supabase.rpc('get_user_storage_sum', { uid: userId }); 
    // Note: You'll need to create a simple Postgres Function in Supabase for this
}
