// import express from 'express';
// import multer from 'multer';
// import PDF from '../cloud/parsefunction/pdf/PDF.js';

// const router = express.Router();

// // Configure multer for in-memory file storage
// const storage = multer.memoryStorage();
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });

// /**
//  * POST /api/signPdf
//  * Upload and sign a PDF file
//  * 
//  * Form data:
//  * - pdfFile: binary PDF file
//  * - docId: document ID (query param or form field)
//  * - isCustomCompletionMail: boolean (query param or form field)
//  * - signature: base64 signature image (query param or form field)
//  */
// router.post('/signPdf', upload.single('pdfFile'), async (req, res) => {
//   try {
//     // Validate file was uploaded
//     if (!req.file) {
//       return res.status(400).json({ error: 'No PDF file provided' });
//     }

//     // Get parameters from query string or form body
//     const docId = req.query.docId || req.body.docId;
//     const isCustomCompletionMail = req.query.isCustomCompletionMail === 'true' || req.body.isCustomCompletionMail === 'true';
//     const signature = req.query.signature || req.body.signature;
//     const userId = req.query.userId || req.body.userId;

//     // Validate required parameters
//     if (!docId || !userId) {
//       return res.status(400).json({ error: 'Missing required parameters: docId, userId' });
//     }

//     console.log('📄 signPdf file upload received:', {
//       fileName: req.file.originalname,
//       fileSize: req.file.size,
//       docId,
//       hasSignature: !!signature
//     });

//     // Create a mock request object that matches Parse Cloud Function format
//     const mockReq = {
//   params: {
//     pdfFile: req.file.buffer,
//     docId,
//     isCustomCompletionMail,
//     signature,
//     userId
//   },

//   headers: {
//     "x-real-ip": req.ip || req.connection.remoteAddress || "127.0.0.1",
//     public_url: "http://localhost:3000"
//   },

//   user: {
//     id: userId
//   }
// };

//     // Call the PDF signing function
//     const result = await PDF(mockReq);

//     console.log('✅ PDF signed successfully');
//     res.json({ status: 'success', data: result.data });

//   } catch (error) {
//     console.error('❌ Error signing PDF:', error.message);
//     res.status(400).json({ 
//       error: error.message || 'Error signing PDF',
//       status: 'error'
//     });
//   }
// });

// export default router;
import express from "express";
import multer from "multer";
import PDF from "../cloud/parsefunction/pdf/PDF.js";

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

// POST /api/signPdf
router.post(
  "/signPdf",
  upload.single("pdfFile"),
  async (req, res) => {
    try {
      // Validate file
      if (!req.file) {
        return res.status(400).json({
          status: "error",
          error: "No PDF file uploaded"
        });
      }

      // Query/body params
      const docId = req.query.docId || req.body.docId;

      const userId = req.query.userId || req.body.userId;

      const signature =
        req.query.signature || req.body.signature;

      const isCustomCompletionMail =
        req.query.isCustomCompletionMail === "true" ||
        req.body.isCustomCompletionMail === "true";

      // Validate required fields
      if (!docId || !userId) {
        return res.status(400).json({
          status: "error",
          error: "Missing docId or userId"
        });
      }

      console.log("📄 signPdf request received");

      // Create mock request object for PDF.js
      const mockReq = {
        params: {
          pdfFile: req.file.buffer,
          docId,
          isCustomCompletionMail,
          signature,
          userId
        },

        headers: {
          "x-real-ip":
            req.ip ||
            req.connection.remoteAddress ||
            "127.0.0.1",

          public_url: "http://localhost:3000"
        },

        user: {
          id: userId
        }
      };

      // Call PDF signing logic
      const result = await PDF(mockReq);

      console.log("✅ PDF signed successfully");

      return res.json({
        status: "success",
        data: result.data
      });
    } catch (error) {
      console.error("❌ signPdf error:", error);

      return res.status(400).json({
        status: "error",
        error: error.message || "Error signing PDF"
      });
    }
  }
);

export default router;