// Supabase setup
const SUPABASE_URL = "https://qyjkopxlipnigcpojczq.supabase.co";
const SUPABASE_KEY = "sb_publishable_rIz5MuuqzXdOeYcvhMXt1w_9r6-si9B";
const BUCKET_NAME = "user-files";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
 
// Elements
const pwInput = document.getElementById("pw");
const pwBtn = document.getElementById("pwBtn");
const message = document.getElementById("message");
const actions = document.getElementById("actions");
const ioGrid = document.getElementById("ioGrid");
const chooseFiles = document.getElementById("chooseFiles");
const startUpload = document.getElementById("startUpload");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const downloadList = document.getElementById("downloadList");

// Password protection (simple example)
const ACCESS_PASSWORD = "ICHIGODUZUMAKI"; // Change this to your own secret

pwBtn.addEventListener("click", () => {
  if (pwInput.value === ACCESS_PASSWORD) {
    message.textContent = "Access Granted✅🗿.";
    message.className = "ok";
    ioGrid.style.display = "block";
  } else {
    message.textContent = "Access Denied❌🤡.";
    message.className = "bad";
    ioGrid.style.display = "none";
  }
});

// Choose files button
chooseFiles.addEventListener("click", () => fileInput.click());

// Display selected files
fileInput.addEventListener("change", () => {
  fileList.innerHTML = "";
  Array.from(fileInput.files).forEach(file => {
    const li = document.createElement("li");
    li.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    fileList.appendChild(li);
  });
});

// Upload files to Supabase
startUpload.addEventListener("click", async () => {
  if (!fileInput.files.length) return showTronModal("No files selected!");
// Max file size in bytes (50 MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Check file sizes before uploading
for (const file of fileInput.files) {
  if (file.size > MAX_FILE_SIZE) {
    showTronModal(`"${file.name}" exceeds 50 MB limit!⚠️`);
    return; // stop upload entirely
  }
}
  for (const file of fileInput.files) {
    const { error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(file.name, file, {
  cacheControl: "3600",
  upsert: false
});
      

    if (error) {
      console.error(error);
      return showTronModal("Upload failed!");
    }
  }

  showTronModal("Files uploaded!");
  fileInput.value = "";
  fileList.innerHTML = "";
  loadFiles();
});

// Load files from Supabase
async function loadFiles() {
  const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).list();
  if (error) {
    console.error(error);
    return;
  }

  if (!data.length) {
    downloadList.innerHTML = "<em>No files listed yet.</em>";
    return;
  }

  downloadList.innerHTML = "";
  data.forEach(file => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = `⬇️ ${file.name}`;
    btn.onclick = () => downloadFile(file.name);
    downloadList.appendChild(btn);
  });
}

// Download file
async function downloadFile(fileName) {
  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .download(fileName);

  if (error) {
    console.error(error);
    return showTronModal("Download failed!");
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showTronModal("Download started!");
}

// Tron popup
function showTronModal(message) {
  const modal = document.createElement("div");
  modal.className = "tron-modal";
  modal.textContent = message;
  document.body.appendChild(modal);
  setTimeout(() => modal.remove(), 2000);
}

// Load files initially
// Wait for page load
loadFiles();
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  // Ensure loader is fully visible first
  loader.style.opacity = "1";
  loader.style.visibility = "visible";

  // Now wait full 5 seconds before hiding
  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
  }, 5000);
});
