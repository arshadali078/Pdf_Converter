const express = require("express");
const cors = require("cors");
const multer = require("multer");
const doctopdf = require("docx-pdf");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});

// Utility: Ensure directory exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir);
        } catch (error) {
            console.error(`Error creating directory ${dir}:`, error);
            throw error;
        }
    }
};

// Setup storage for uploaded files
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

// Multer file filter to allow only DOC/DOCX files
const fileFilter = (req, file, cb) => {
    const allowedTypes = [".doc", ".docx"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        return cb(new Error("Only .doc and .docx files are allowed"), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

app.post("/convertfile", upload.single("file"), (req, res) => {
    try {
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

        console.log("Uploaded file path:", uploadPath);
        console.log("Output file path:", outputPath);

        // Convert DOCX to PDF
        doctopdf(uploadPath, outputPath, (err) => {
            if (err) {
                console.error("Error during conversion:", err);
                return res.status(500).json({
                    message: "Error converting DOCX to PDF",
                });
            }

            console.log("Conversion successful. File saved to:", outputPath);

            // Check if the output file exists and send for download
            if (fs.existsSync(outputPath)) {
                res.download(outputPath, (err) => {
                    if (err) {
                        console.error("Error sending file:", err);
                        res.status(500).json({ message: "Error sending file" });
                    } else {
                        console.log("File downloaded successfully");

                        // Cleanup uploaded and output files
                        fs.unlinkSync(uploadPath);
                        fs.unlinkSync(outputPath);
                    }
                });
            } else {
                res.status(500).json({ message: "File not found after conversion" });
            }
        });
    } catch (error) {
        console.error("Internal server error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
