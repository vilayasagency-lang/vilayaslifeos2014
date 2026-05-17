/**
 * Admin Logic Handler
 */
export async function handleAdmin(request, env) {
  // Check if User is Admin (already verified in middleware)
  
  // Get R2 Bucket Stats
  const bucket = env.R2_BUCKET;
  const objects = await bucket.list();
  
  let totalSize = 0;
  objects.objects.forEach(obj => totalSize += obj.size);

  const stats = {
    storageUsedGB: (totalSize / (1024 * 1024 * 1024)).toFixed(4),
    activeAlerts: 0, // Logic to fetch active SOS from DB
    systemStatus: "Healthy"
  };

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" }
  });
}
