// Supabase setup
const SUPABASE_URL = "https://qyjkopxlipnigcpojczq.supabase.co";
const SUPABASE_KEY = "sb_publishable_rIz5MuuqzXdOeYcvhMXt1w_9r6-si9B";
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

// Upload files to Supabase with progress bar
startUpload.addEventListener("click", async () => {
  if (!fileInput.files.length) return showTronModal("No files selected!⚠️");

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  // Check file sizes
  for (const file of fileInput.files) {
    if (file.size > MAX_FILE_SIZE) {
      showTronModal(`"${file.name}" exceeds 50 MB limit!⚠️`);
      return;
    }
  }

  // Create progress container
  const progressContainer = document.createElement("div");
  progressContainer.style.position = "fixed";
  progressContainer.style.top = "50%";
  progressContainer.style.left = "50%";
  progressContainer.style.transform = "translate(-50%, -50%)";
  progressContainer.style.width = "80%";
  progressContainer.style.height = "20px";
  progressContainer.style.background = "rgba(0,0,0,0.5)";
  progressContainer.style.border = "2px solid cyan";
  progressContainer.style.borderRadius = "10px";
  progressContainer.style.overflow = "hidden";
  progressContainer.style.zIndex = "9999";

  const progressFill = document.createElement("div");
  progressFill.style.height = "100%";
  progressFill.style.width = "0%";
  progressFill.style.background = "cyan";
  progressContainer.appendChild(progressFill);
  document.body.appendChild(progressContainer);

  let uploadedFiles = 0;
  for (const file of fileInput.files) {
    // Convert file to Blob for tracking progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percent = ((uploadedFiles + event.loaded / event.total) / fileInput.files.length) * 100;
          progressFill.style.width = percent + "%";
        }
      };

      xhr.onload = async function () {
        if (xhr.status === 200 || xhr.status === 201) {
          uploadedFiles++;
          resolve();
        } else {
          reject(new Error("Upload failed⚠️"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload error⚠️"));

      // Prepare request to Supabase
      const formData = new FormData();
      formData.append("cacheControl", "3600");
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
    // Sort files by creation date descending
data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
