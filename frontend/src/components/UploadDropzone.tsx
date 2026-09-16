import { Plus, RotateCcw } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'

interface Props {
  onFileSelected: (file: File) => void
  disabled?: boolean
  label: string
}

export function UploadDropzone({ onFileSelected, disabled, label }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return
      setPreview(URL.createObjectURL(file))
      setFileName(file.name)
      onFileSelected(file)
    },
    [disabled, onFileSelected],
  )

  return (
    <div
      className={`relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-[24px] border transition-all duration-200 ${
        dragOver
          ? 'border-accent bg-accent/[0.06] scale-[1.005]'
          : preview
            ? 'border-line bg-surface'
            : 'border-line/80 bg-surface border-dashed hover:border-zinc-600'
      } ${disabled ? 'opacity-60' : 'cursor-pointer'}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFile(e.dataTransfer.files[0])
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <>
          <img src={preview} alt="Selected upload preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
          <div className="absolute bottom-4 flex items-center gap-2 rounded-full bg-black/60 px-3.5 py-2 text-xs text-white backdrop-blur-sm">
            <RotateCcw size={13} />
            <span className="max-w-[200px] truncate">{fileName}</span>
            <span className="text-white/50">· {t('common.change')}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className="bg-gradient-ai flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)]">
            <Plus className="text-white" size={26} strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <p className="text-ink text-[15px] font-medium">{label}</p>
            <p className="text-muted mt-2 text-xs tracking-wide uppercase">{t('common.jpgPngWebp')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
