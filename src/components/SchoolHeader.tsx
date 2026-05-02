import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ImageCropModal from './ImageCropModal';
import './SchoolHeader.css';

interface SchoolInfo {
  name: string;
  address: string; // School address
  reportSheetTitle: string; // Report sheet title (e.g., "BASIC PRIMARY 2025/26 2nd TERM REPORT SHEET")
  logo: string | null; // Base64 encoded image
  backgroundImage: string | null; // Base64 encoded background image
}

const SchoolHeader: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMasterAdmin = user?.role === 'admin' && user?.email === 'admin@school.com' && !user?.classId;
  
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const stored = localStorage.getItem('school-info');
    return stored ? JSON.parse(stored) : { name: 'Your School Name', address: 'School Address', reportSheetTitle: 'BASIC PRIMARY 2025/26 2nd TERM REPORT SHEET', logo: null, backgroundImage: null };
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(schoolInfo.name);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(schoolInfo.address);
  const [isEditingReportSheetTitle, setIsEditingReportSheetTitle] = useState(false);
  const [tempReportSheetTitle, setTempReportSheetTitle] = useState(schoolInfo.reportSheetTitle);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToBeProcessed, setImageToBeProcessed] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever schoolInfo changes
  useEffect(() => {
    localStorage.setItem('school-info', JSON.stringify(schoolInfo));
  }, [schoolInfo]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempName(e.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempAddress(e.target.value);
  };

  const handleReportSheetTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempReportSheetTitle(e.target.value);
  };

  const handleSaveName = () => {
    if (!isMasterAdmin) return; // Only master admin can save
    if (tempName.trim()) {
      setSchoolInfo({ ...schoolInfo, name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleSaveAddress = () => {
    if (!isMasterAdmin) return; // Only master admin can save
    if (tempAddress.trim()) {
      setSchoolInfo({ ...schoolInfo, address: tempAddress.trim() });
      setIsEditingAddress(false);
    }
  };

  const handleSaveReportSheetTitle = () => {
    if (!isMasterAdmin) return; // Only master admin can save
    if (tempReportSheetTitle.trim()) {
      setSchoolInfo({ ...schoolInfo, reportSheetTitle: tempReportSheetTitle.trim() });
      setIsEditingReportSheetTitle(false);
    }
  };

  const handleEditClick = () => {
    if (!isMasterAdmin) return; // Only master admin can edit
    setIsEditingName(true);
    setTempName(schoolInfo.name);
  };

  const handleEditAddressClick = () => {
    if (!isMasterAdmin) return; // Only master admin can edit
    setIsEditingAddress(true);
    setTempAddress(schoolInfo.address);
  };

  const handleEditReportSheetTitleClick = () => {
    if (!isMasterAdmin) return; // Only master admin can edit
    setIsEditingReportSheetTitle(true);
    setTempReportSheetTitle(schoolInfo.reportSheetTitle);
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('❌ Please upload an image file');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadMessage('❌ File size must be less than 2MB');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setSchoolInfo({ ...schoolInfo, logo: base64String });
      setUploadMessage('✅ Logo uploaded successfully');
      setTimeout(() => setUploadMessage(''), 3000);
    };
    reader.onerror = () => {
      setUploadMessage('❌ Error reading file');
      setTimeout(() => setUploadMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSchoolInfo({ ...schoolInfo, logo: null });
    setUploadMessage('✅ Logo removed');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  const handleBackgroundClick = () => {
    bgFileInputRef.current?.click();
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('❌ Please upload an image file');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    // Validate file size (max 5MB for backgrounds)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('❌ File size must be less than 5MB');
      setTimeout(() => setUploadMessage(''), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      // Open crop modal instead of directly saving
      setImageToBeProcessed(base64String);
      setIsCropModalOpen(true);
    };
    reader.onerror = () => {
      setUploadMessage('❌ Error reading file');
      setTimeout(() => setUploadMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    setSchoolInfo({ ...schoolInfo, backgroundImage: croppedImage });
    setUploadMessage('✅ Background image uploaded successfully');
    setIsCropModalOpen(false);
    setImageToBeProcessed(null);
    setTimeout(() => setUploadMessage(''), 3000);
  };

  const handleCropCancel = () => {
    setIsCropModalOpen(false);
    setImageToBeProcessed(null);
  };

  const handleRemoveBackground = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSchoolInfo({ ...schoolInfo, backgroundImage: null });
    setUploadMessage('✅ Background image removed');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  return (
    <>
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSource={imageToBeProcessed || ''}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
      <div 
        className="school-header"
        style={{
          backgroundImage: schoolInfo.backgroundImage ? `url(${schoolInfo.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Background Overlay */}
        <div className="school-header-overlay" />

        {/* Background Upload Button - Admin Only */}
        {isAdmin && schoolInfo.backgroundImage && (
          <button
            className="bg-control-btn remove-bg-btn"
            onClick={handleRemoveBackground}
            title="Remove background image"
          >
            ✕ Remove Background
          </button>
        )}
        
        {isAdmin && !schoolInfo.backgroundImage && (
          <button
            className="bg-control-btn add-bg-btn"
            onClick={handleBackgroundClick}
            title="Add background image to banner"
          >
            🖼️ Add Background
          </button>
        )}

        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackgroundUpload}
          style={{ display: 'none' }}
          aria-label="Upload banner background image"
          disabled={!isAdmin}
        />

        <div className="school-header-content">
          {/* Logo Box */}
          <div className="logo-section">
            <div 
              className={`logo-box ${!isAdmin ? 'disabled' : ''}`}
              onClick={isAdmin ? handleLogoClick : undefined}
              title={isAdmin ? "Click to upload logo" : "Admin only - Logo upload restricted"}
              style={{ cursor: isAdmin ? 'pointer' : 'not-allowed', opacity: isAdmin ? 1 : 0.6 }}
            >
              {schoolInfo.logo ? (
                <>
                  <img src={schoolInfo.logo} alt="School Logo" className="school-logo" />
                  {isAdmin && (
                    <button
                      className="remove-logo-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLogo();
                      }}
                      title="Remove logo"
                    >
                      ✕
                    </button>
                  )}
                </>
              ) : (
                <div className="logo-placeholder">
                  <span className="upload-icon">{isAdmin ? '📤' : '🔒'}</span>
                  <span className="upload-text">{isAdmin ? 'Click to upload logo' : 'Admin only'}</span>
                </div>
              )}
            </div>
            {isAdmin && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
                aria-label="Upload school logo"
              />
            )}
            {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
          </div>

          {/* School Name Section */}
          <div className="name-section">
            {isEditingName ? (
              <div className="name-edit-container">
                <input
                  type="text"
                  value={tempName}
                  onChange={handleNameChange}
                  onKeyDown={(e) => {
                    // Enable Tab key to insert tab character instead of moving focus
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const start = input.selectionStart || 0;
                      const end = input.selectionEnd || 0;
                      const newValue = tempName.substring(0, start) + '\t' + tempName.substring(end);
                      setTempName(newValue);
                      // Move cursor after the tab
                      setTimeout(() => {
                        input.selectionStart = input.selectionEnd = start + 1;
                      }, 0);
                    }
                  }}
                  className="school-name-input"
                  placeholder="Enter school name"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="save-btn"
                  title="Save school name"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="cancel-btn"
                  title="Cancel editing"
                >
                  ✕ Cancel
                </button>
              </div>
            ) : (
              <div className="name-display-container">
                <h1 className="school-name">{schoolInfo.name}</h1>
                {isMasterAdmin && (
                  <button
                    onClick={handleEditClick}
                    className="edit-btn"
                    title="Edit school name"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            )}
            {/* School Address Section */}
            {isEditingAddress ? (
              <div className="address-edit-container">
                <input
                  type="text"
                  value={tempAddress}
                  onChange={handleAddressChange}
                  className="school-address-input"
                  placeholder="Enter school address"
                  autoFocus
                />
                <button
                  onClick={handleSaveAddress}
                  className="save-btn-small"
                  title="Save address"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setIsEditingAddress(false)}
                  className="cancel-btn-small"
                  title="Cancel editing"
                >
                  ✕ Cancel
                </button>
              </div>
            ) : (
              <div className="address-display-container">
                <p className="school-address">{schoolInfo.address}</p>
                {isMasterAdmin && (
                  <button
                    onClick={handleEditAddressClick}
                    className="edit-address-btn"
                    title="Edit school address"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
            {/* Report Sheet Title Section */}
            {isEditingReportSheetTitle ? (
              <div className="address-edit-container">
                <input
                  type="text"
                  value={tempReportSheetTitle}
                  onChange={handleReportSheetTitleChange}
                  className="school-address-input"
                  placeholder="Enter report sheet title"
                  autoFocus
                />
                <button
                  onClick={handleSaveReportSheetTitle}
                  className="save-btn-small"
                  title="Save report sheet title"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setIsEditingReportSheetTitle(false)}
                  className="cancel-btn-small"
                  title="Cancel editing"
                >
                  ✕ Cancel
                </button>
              </div>
            ) : (
              <div className="address-display-container">
                <p className="school-address" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  📄 {schoolInfo.reportSheetTitle}
                </p>
                {isMasterAdmin && (
                  <button
                    onClick={handleEditReportSheetTitleClick}
                    className="edit-address-btn"
                    title="Edit report sheet title"
                  >
                    ✏️
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolHeader;
