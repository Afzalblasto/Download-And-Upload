
// Supabase setup
const SUPABASE_URL = "https://qyjkopxlipnigcpojczq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5amtvcHhsaXBuaWdjcG9qY3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzE0NDMsImV4cCI6MjA3MDc0NzQ0M30.7wD7aHeZrV81xAuuicjr9T1LLYXVDd6-9RoKu0T07Y0";  // paste your new anon key here
const BUCKET_NAME = "user-files";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elements
const pwInput = document.getElementById("pw");
const pwBtn = document.getElementById("pwBtn");
const message = document.getElementById("message");
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


  // Upload files with password protection + progress
startUpload.addEventListener("click", async () => {
  if (!fileInput.files.length) 
    return showTronModal("No files selected!⚠️");

  // 🔑 Ask for upload password
  const uploadPass = await askUploadPassword();
if (uploadPass !== "ICHIGODUZUMAKI") {
  return showTronModal("Wrong upload password!⚠️");
}

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  // Check file sizes
  for (const file of fileInput.files) {
    if (file.size > MAX_FILE_SIZE) {
      return showTronModal(`"${file.name}" exceeds 50 MB limit!⚠️`);
    }
  }

  // Check duplicates
  const { data: existingFiles, error: listError } = await supabaseClient
    .storage.from(BUCKET_NAME).list();

  if (listError) {
    console.error(listError);
    return showTronModal("Error checking files!⚠️");
  }

  const existingNames = existingFiles.map(f => f.name.toLowerCase());
  for (const file of fileInput.files) {
    if (existingNames.includes(file.name.toLowerCase())) {
      return showTronModal(`"${file.name}" already exists!⚠️`);
    }
  }

  // Progress bar
  const progressContainer = document.createElement("div");
  progressContainer.style = `
    position:fixed;top:50%;left:50%;
    transform:translate(-50%,-50%);
    width:80%;height:20px;background:rgba(0,0,0,0.5);
    border:2px solid cyan;border-radius:10px;
    overflow:hidden;z-index:9999;`;
  const progressFill = document.createElement("div");
  progressFill.style = "height:100%;width:0%;background:cyan;";
  progressContainer.appendChild(progressFill);
  document.body.appendChild(progressContainer);
  let totalSize = Array.from(fileInput.files).reduce((sum, f) => sum + f.size, 0);
let uploadedBytes = 0;
  let uploaded = 0;
  for (const file of fileInput.files) {
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          const percent = ((uploadedBytes + e.loaded) / totalSize) * 100;
          progressFill.style.width = percent + "%";
        }
      };
      xhr.onload = () => { 
  uploadedBytes += file.size; 
  uploaded++; 
  resolve(); 
};
      xhr.onerror = () => reject(new Error("Upload error"));
      const formData = new FormData();
      formData.append("file", file);
      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${file.name}`);
      xhr.setRequestHeader("apikey", SUPABASE_KEY);
      xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_KEY}`);
      xhr.send(formData);
    }).catch(err => {
      console.error(err);
      showTronModal("Upload failed!⚠️");
    });
  }

  document.body.removeChild(progressContainer);
  showTronModal("Files uploaded!🌌");
  fileInput.value = "";
  fileList.innerHTML = "";
  loadFiles();
});
  
// Load files from Supabase (root of bucket)
async function loadFiles() {
  const { data, error } = await supabaseClient
    .storage.from(BUCKET_NAME)
    .list("", {
      limit: 100,
      offset: 0,
    });

  if (error) {
    console.error(error);
    return;
  }

  if (!data || !data.length) {
    downloadList.innerHTML = "<em>No files listed yet.</em>";
    return;
  }

  // Sort safely: prefer updated_at/created_at if present, else by name
  data.sort((a, b) => {
    if (a.updated_at && b.updated_at) {
      return new Date(b.updated_at) - new Date(a.updated_at); // newest first
    }
    return a.name.localeCompare(b.name); // fallback by name
  });

  // Render file list in Tron grid style
  downloadList.innerHTML = "";
  data.forEach((file) => {
    const item = document.createElement("div");
    item.className = "file-item";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = file.name;

    const btn = document.createElement("button");
    btn.textContent = "Download";
    btn.onclick = () => downloadFile(file.name);

    item.appendChild(nameSpan);
    item.appendChild(btn);
    downloadList.appendChild(item);
  });
}
  

// Download file
async function downloadFile(fileName) {
  const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).download(fileName);
  if (error) {
    console.error(error);
    return showTronModal("Download failed!⚠️");
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showTronModal("Download started!🌌");
}

// Tron popup
function showTronModal(message) {
  const modal = document.createElement("div");
  modal.className = "tron-modal";
  modal.textContent = message;
  document.body.appendChild(modal);
  setTimeout(() => modal.remove(), 2000);
}
// Custom Tron Password Modal
async function askUploadPassword() {
  return new Promise((resolve) => {
    const modal = document.getElementById("tronPasswordModal");
    const input = document.getElementById("uploadPwInput");
    const okBtn = document.getElementById("pwOk");
    const cancelBtn = document.getElementById("pwCancel");

    modal.style.display = "flex";
    input.value = "";
    input.focus();

    okBtn.onclick = () => {
      modal.style.display = "none";
      resolve(input.value);
    };
    cancelBtn.onclick = () => {
      modal.style.display = "none";
      resolve(null);
    };
  });
}
// Loader timing
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  loader.style.opacity = "1";
  loader.style.visibility = "visible";
  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.visibility = "hidden";
  }, 5000); // 5 seconds
});

// Load files initially
loadFiles();
