/**
 * Cloudflare R2 Upload Handler
 */
export async function handleUploads(request, env) {
  const url = new URL(request.url);
  
  // Endpoint: /uploads/sign?file=name.jpg&type=image/jpeg&folder=vault
  if (url.pathname === '/uploads/sign') {
    const fileName = url.searchParams.get('file');
    const fileType = url.searchParams.get('type');
    const folder = url.searchParams.get('folder') || 'vault';
    
    // Generate a unique key for R2
    const fileKey = `${folder}/${Date.now()}-${fileName}`;

    // Get a Presigned URL for PUT operation (Valid for 60 seconds)
    const uploadUrl = await env.R2_BUCKET.createSignedUrl(fileKey, {
      method: 'PUT',
      expiresIn: 60,
      contentType: fileType,
    });

    return new Response(JSON.stringify({
      uploadUrl,
      fileKey
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  return new Response("Not Found", { status: 404 });
}
