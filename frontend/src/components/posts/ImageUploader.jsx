import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { getPostImageUrl } from '../../api/postsApi.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024;

/**
 * @param {{
 *   postId: string,
 *   image: { filename?: string } | null | undefined,
 *   onUpload: (file: File) => void,
 *   onRemove: () => void,
 *   uploading?: boolean,
 *   removing?: boolean,
 *   disabled?: boolean,
 * }} props
 */
export function ImageUploader({ postId, image, onUpload, onRemove, uploading = false, removing = false, disabled = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [clientError, setClientError] = useState('');

  const validateAndUpload = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type)) {
      setClientError('Please choose a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setClientError('Image must be smaller than 8 MB.');
      return;
    }
    setClientError('');
    onUpload(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled) return;
    validateAndUpload(event.dataTransfer.files?.[0]);
  };

  if (image?.filename) {
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-(--color-ink)">Image</p>
        <div className="relative overflow-hidden rounded-lg border border-(--color-line)">
          <img src={getPostImageUrl(postId)} alt="" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled || removing}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-(--color-ink)/70 text-white hover:bg-(--color-critical) disabled:opacity-60"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-(--color-ink)">Image (optional)</p>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          dragOver ? 'border-(--color-accent) bg-(--color-accent-soft)' : 'border-(--color-line) hover:border-(--color-accent)'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-(--color-ink-faint)" />
            <span className="text-(--color-ink-soft)">Uploading…</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-(--color-ink-faint)" strokeWidth={1.5} />
            <span className="text-(--color-ink-soft)">Click or drag an image here</span>
            <span className="text-xs text-(--color-ink-faint)">JPEG, PNG, GIF, or WebP · up to 8 MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => validateAndUpload(event.target.files?.[0])}
      />
      {clientError && <p className="mt-1.5 text-sm text-(--color-critical)">{clientError}</p>}
    </div>
  );
}