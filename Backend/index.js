const express = require("express");
const cors = require("cors");
const multer = require("multer");
const doctopdf = require("docx-pdf");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.use(cors({ origin: "https://pdf-converter-h8o2.vercel.app" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utility function to ensure directories exist
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "upload";
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (![".doc", ".docx"].includes(path.extname(file.originalname).toLowerCase())) {
        return cb(new Error("Only .doc and .docx files are allowed"), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

app.post("/convertfile", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadPath = path.join(__dirname, "upload", req.file.originalname);
    const outputDir = path.join(__dirname, "file");
    ensureDirectoryExists(outputDir);

    const outputPath = path.join(
        outputDir,
        `${path.basename(req.file.originalname, path.extname(req.file.originalname))}.pdf`
    );

    doctopdf(uploadPath, outputPath, (err) => {
        if (err) {
            console.error("Error during conversion:", err);
            return res.status(500).json({ message: "Error converting DOCX to PDF" });
        }

        if (!fs.existsSync(outputPath)) {
            return res.status(500).json({ message: "PDF conversion failed, file not created" });
        }

        res.download(outputPath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ message: "Error sending file" });
            } else {
                console.log("File downloaded successfully");
                fs.unlinkSync(uploadPath);
                fs.unlinkSync(outputPath);
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
