import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';
import path from 'path';

/**
 * Reads content from a Word document (.docx)
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<string>} - Extracted text content
 */
export async function readWordDocument(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to read Word document: ${error.message}`);
  }
}

/**
 * Updates a Word document with new content
 * Overwrites the existing file to save space
 * @param {string} filePath - Path to the Word document
 * @param {string} newContent - New content to write
 * @returns {Promise<void>}
 */
export async function updateWordDocument(filePath, newContent) {
  try {
    // Parse the content into paragraphs
    const paragraphs = newContent.split('\n').filter(line => line.trim());
    
    // Create a new document with the content
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs.map(text => 
          new Paragraph({
            children: [new TextRun(text)]
          })
        )
      }]
    });
    
    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Overwrite the existing file
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✓ Updated Word document: ${path.basename(filePath)}`);
  } catch (error) {
    throw new Error(`Failed to update Word document: ${error.message}`);
  }
}

/**
 * Creates a backup of the original resume before modifying
 * @param {string} filePath - Path to the original file
 * @returns {Promise<string>} - Path to the backup file
 */
export async function createResumeBackup(filePath) {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    
    // Create backup with _original suffix
    const backupPath = path.join(dir, `${basename}_original${ext}`);
    
    // Only create backup if it doesn't exist (preserve original)
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
      console.log(`✓ Created backup: ${path.basename(backupPath)}`);
    }
    
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error.message}`);
  }
}

/**
 * Restores the original resume from backup
 * @param {string} filePath - Path to the current file
 * @returns {Promise<boolean>} - True if restored, false if no backup exists
 */
export async function restoreOriginalResume(filePath) {
  try {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    
    const backupPath = path.join(dir, `${basename}_original${ext}`);
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, filePath);
      console.log(`✓ Restored original resume: ${path.basename(filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    throw new Error(`Failed to restore original resume: ${error.message}`);
  }
}

/**
 * Checks if a file is a Word document
 * @param {string} filePath - Path to the file
 * @returns {boolean}
 */
export function isWordDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.docx' || ext === '.doc';
}

/**
 * Reads resume content (only supports .docx)
 * @param {string} filePath - Path to the resume file
 * @returns {Promise<string>} - Resume content
 */
export async function readResumeContent(filePath) {
  try {
    if (!isWordDocument(filePath)) {
      throw new Error('Only Word documents (.docx) are supported for resumes');
    }
    return await readWordDocument(filePath);
  } catch (error) {
    throw new Error(`Failed to read resume: ${error.message}`);
  }
}

/**
 * Updates resume content (only supports .docx)
 * Overwrites the existing file
 * @param {string} filePath - Path to the resume file
 * @param {string} newContent - New content
 * @returns {Promise<void>}
 */
export async function updateResumeContent(filePath, newContent) {
  try {
    if (!isWordDocument(filePath)) {
      throw new Error('Only Word documents (.docx) are supported for resumes');
    }
    await updateWordDocument(filePath, newContent);
  } catch (error) {
    throw new Error(`Failed to update resume: ${error.message}`);
  }
}
