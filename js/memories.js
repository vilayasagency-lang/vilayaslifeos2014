document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    loadMemories(user.id);

    // --- Modal Logic ---
    const modal = document.getElementById('memory-modal');
    const addBtn = document.getElementById('add-memory-btn');
    const closeBtn = document.getElementById('close-memory-modal');

    addBtn.onclick = () => modal.style.display = 'flex';
    closeBtn.onclick = () => modal.style.display = 'none';

    // --- Image Preview Logic ---
    const fileInput = document.getElementById('memory-upload');
    const previewArea = document.getElementById('image-preview');
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (prev) => {
                previewArea.innerHTML = `<img src="${prev.target.result}" style="width:100%; border-radius:10px;">`;
                previewArea.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Save Memory Logic ---
    document.getElementById('memory-form').onsubmit = async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('save-memory-btn');
        const file = fileInput.files[0];
        const caption = document.getElementById('memory-caption').value;
        const category = document.getElementById('memory-category').value;

        if (!file) return alert("Please select an image");

        saveBtn.innerText = "Uploading to Cloud...";
        saveBtn.disabled = true;

        try {
            // 1. Get Signed URL from Worker for R2
            const { uploadUrl, fileKey } = await api.getUploadUrl(file.name, file.type, 'memory-images');

            // 2. Upload to R2
            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            // 3. Save Metadata to Supabase
            const { error } = await supabase.from('memories').insert([{
                user_id: user.id,
                caption: caption,
                file_key: fileKey,
                category: category
            }]);

            if (error) throw error;

            location.reload(); // Refresh to show new memory
        } catch (err) {
            alert("Error: " + err.message);
            saveBtn.innerText = "Save to Cloud";
            saveBtn.disabled = false;
        }
    };
});

// Load Memories from Supabase
async function loadMemories(userId) {
    const container = document.getElementById('memories-container');
    
    const { data: memories, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) return;

    if (memories.length === 0) {
        container.innerHTML = '<div class="empty-state">No memories yet. Add your first photo!</div>';
        return;
    }

    // Note: Aapko Cloudflare Worker se ek Public URL route banana hoga to serve R2 images
    const R2_PUBLIC_BASE = "https://cdn.yourdomain.com"; 

    container.innerHTML = memories.map(m => `
        <div class="card memory-card fade-in" onclick="viewFullImage('${R2_PUBLIC_BASE}/${m.file_key}', '${m.caption}')">
            <img src="${R2_PUBLIC_BASE}/${m.file_key}" loading="lazy" alt="Memory">
            <div class="memory-overlay">
                <p>${m.caption}</p>
                <span class="category-tag">${m.category}</span>
            </div>
        </div>
    `).join('');
}

function viewFullImage(url, caption) {
    const modal = document.getElementById('view-modal');
    document.getElementById('full-image').src = url;
    document.getElementById('caption-text').innerText = caption;
    modal.style.display = 'flex';
}

document.querySelector('.close-view').onclick = () => {
    document.getElementById('view-modal').style.display = 'none';
};
