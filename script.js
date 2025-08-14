document.addEventListener("DOMContentLoaded", () => {
  const SUPABASE_URL = "https://qyjkopxlipnigcpojczq.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rIz5MuuqzXdOeYcvhMXt1w_9r6-si9B";
  const BUCKET_NAME = "user-files";
  const { createClient } = supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

  const HASH_HEX = "09279688e65b1864e2f1595bc3752364c0150500b6c52f38e140f1f819b732ea";
  const pwInput = document.getElementById('pw');
  const pwBtn = document.getElementById('pwBtn');
  const msg = document.getElementById('message');
  const actions = document.getElementById('actions');
  const ioGrid = document.getElementById('ioGrid');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  const startUpload = document.getElementById('startUpload');
  const upBox = document.getElementById('upBox');
  const downBox = document.getElementById('downBox');

  let failCount = 0;

  async function sha256Hex(text){
    const enc = new TextEncoder().encode(text);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function constantTimeEqual(a,b){
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i=0; i<a.length; i++){ diff |= a.charCodeAt(i) ^ b.charCodeAt(i); }
    return diff === 0;
  }
  async function verifyPassword(){
    const value = pwInput.value || "";
    if (!value.trim()){ msg.textContent = "Enter the password to continue."; return; }
    msg.textContent = "Verifying…";
    try{
      const hex = await sha256Hex(value);
      if (constantTimeEqual(hex, HASH_HEX)){
        sessionStorage.setItem("afzal_auth","1");
        msg.textContent = "Access granted."; msg.className = "ok";
        unlock();
      }else{
        failCount++; msg.textContent = `Wrong password (${failCount}).`; msg.className = "bad";
      }
    }catch(e){ msg.textContent = "Error verifying."; msg.className = "bad"; }
  }
  function unlock(){
    actions.style.display = "flex"; ioGrid.style.display = "grid"; listFiles();
  }
  if (sessionStorage.getItem("afzal_auth") === "1"){ unlock(); }

  pwBtn.addEventListener('click', verifyPassword);
  pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') verifyPassword(); });

  document.getElementById('chooseFiles').addEventListener('click', ()=> fileInput.click());
  fileInput.addEventListener('change', ()=>{
    fileList.innerHTML = "";
    [...fileInput.files].forEach(f=>{
      const li = document.createElement('li');
      li.textContent = `${f.name} (${Math.ceil(f.size/1024)} KB)`;
      fileList.appendChild(li);
    });
  });

  startUpload.addEventListener('click', async ()=>{
    if (!fileInput.files.length){ alert("Choose files first."); return; }
    for (const file of fileInput.files) {
      const { error } = await supabaseClient.storage.from(BUCKET_NAME).upload(file.name, file, { cacheControl: '3600', upsert: false });
      if (error) alert(`Error uploading ${file.name}: ${error.message}`);
    }
    alert("Upload complete!");
    listFiles();
  });

  async function listFiles(){
    const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).list();
    const downloadList = document.getElementById('downloadList');
    downloadList.innerHTML = "";
    if (error) { downloadList.innerHTML = `<span class="bad">Error: ${error.message}</span>`; return; }
    if (!data.length) { downloadList.innerHTML = "<em>No files found.</em>"; return; }
    data.forEach(file => {
      const div = document.createElement('div');
      const link = document.createElement('a');
      link.textContent = file.name;
      link.href = "#";
      link.addEventListener('click', () => downloadFile(file.name));
      div.appendChild(link);
      downloadList.appendChild(div);
    });
  }

  async function downloadFile(filename){
    const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).download(filename);
    if (error) { alert(`Error: ${error.message}`); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  document.getElementById('btnUpload').addEventListener('click', ()=> upBox.scrollIntoView({behavior:'smooth'}));
  document.getElementById('btnDownload').addEventListener('click', ()=> downBox.scrollIntoView({behavior:'smooth'}));

  // Loader removal
  setTimeout(() => {
    const loader = document.getElementById("loader");
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
  }, 3000);
});