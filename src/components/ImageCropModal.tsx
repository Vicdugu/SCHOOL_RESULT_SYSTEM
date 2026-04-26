import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropModal.css';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSource: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSource,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new Image();
      image.src = imageSource;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            image,
            croppedAreaPixels.x * scaleX,
            croppedAreaPixels.y * scaleY,
            croppedAreaPixels.width * scaleX,
            croppedAreaPixels.height * scaleY,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  onCropComplete(reader.result as string);
                };
                reader.readAsDataURL(blob);
              }
            },
            'image/jpeg',
            0.95
          );
        }
      };
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crop-modal-header">
          <h2>Crop Background Image</h2>
          <button className="crop-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="crop-modal-content">
          <div className="crop-container">
            <Cropper
              image={imageSource}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
              cropShape="rect"
              showGrid={true}
            />
          </div>

          <div className="crop-controls-panel">
            <div className="crop-control-group">
              <label>Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="zoom-slider"
                title="Scroll or pinch to zoom"
              />
              <span className="zoom-value">{(zoom * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="crop-instructions">
            <p>💡 Drag to move • Scroll to zoom • Use slider below</p>
          </div>
        </div>

        <div className="crop-modal-footer">
          <button className="crop-btn cancel-crop-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-btn apply-crop-btn" onClick={handleCrop}>
            ✓ Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
