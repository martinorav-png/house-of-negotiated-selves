import { useEffect, useState } from 'react'
import {
  getAllDirections,
  saveCustomDirections,
  slugifyId,
  type DesignDirection,
} from '../data/designDirections'
import '../styles/gallery.css'

interface Props {
  onSelect: (directionId: string) => void
}

export function GalleryScreen({ onSelect }: Props) {
  const [directions, setDirections] = useState(() =>
    getAllDirections().filter((d) => d.status !== 'archive'),
  )
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({
    name: '',
    tagline: '',
    mood: '',
    fonts: '',
    swatch1: '#08080a',
    swatch2: '#3dff8a',
    swatch3: '#ffb347',
    swatch4: '#141418',
  })

  useEffect(() => {
    fetch('/design-directions.json')
      .then((r) => r.json())
      .then((data: { directions?: DesignDirection[] }) => {
        if (!data.directions?.length) return
        const custom = getAllDirections().filter((d) => !d.builtin)
        const jsonIds = new Set(data.directions.map((d) => d.id))
        const merged = [
          ...data.directions.map((d) => ({ ...d, builtin: true })),
          ...custom.filter((d) => !jsonIds.has(d.id)),
        ]
        setDirections(merged.filter((d) => d.status !== 'archive'))
      })
      .catch(() => {
        /* use built-in list */
      })
  }, [])

  function addDirection(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return

    const id = slugifyId(draft.name)
    const next: DesignDirection = {
      id,
      name: draft.name.trim(),
      tagline: draft.tagline.trim() || 'Custom design direction',
      mood: draft.mood.trim() || '-',
      fonts: draft.fonts.trim() || '-',
      status: 'draft',
      swatches: [draft.swatch1, draft.swatch2, draft.swatch3, draft.swatch4],
    }

    const updated = [...directions.filter((d) => d.id !== id), next]
    const custom = updated.filter((d) => !d.builtin)
    saveCustomDirections(custom)
    setDirections(updated)
    setDraft({
      name: '',
      tagline: '',
      mood: '',
      fonts: '',
      swatch1: '#08080a',
      swatch2: '#3dff8a',
      swatch3: '#ffb347',
      swatch4: '#141418',
    })
    setShowForm(false)
  }

  return (
    <div className="gallery">
      <header className="gallery__header">
        <p className="gallery__eyebrow">House of Negotiated Selves · Mock UI</p>
        <h1 className="gallery__title">Design direction gallery</h1>
        <p className="gallery__lede">
          Pick a visual world to walk the six-screen intake flow. Add new directions here
          or edit <code>public/design-directions.json</code> for built-ins.
        </p>
      </header>

      <div className="gallery__toolbar">
        <button
          type="button"
          className="gallery__add-btn"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ Add direction'}
        </button>
      </div>

      {showForm && (
        <form className="gallery__form" onSubmit={addDirection}>
          <div className="gallery__form-grid">
            <label>
              Name
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Stitch export, clinical noir"
                required
              />
            </label>
            <label>
              Tagline
              <input
                value={draft.tagline}
                onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))}
                placeholder="Short description"
              />
            </label>
            <label>
              Mood
              <input
                value={draft.mood}
                onChange={(e) => setDraft((d) => ({ ...d, mood: e.target.value }))}
                placeholder="Hauntological, warm bait…"
              />
            </label>
            <label>
              Fonts
              <input
                value={draft.fonts}
                onChange={(e) => setDraft((d) => ({ ...d, fonts: e.target.value }))}
                placeholder="Syne · Archivo · Fragment Mono"
              />
            </label>
          </div>
          <div className="gallery__swatch-inputs">
            {(['swatch1', 'swatch2', 'swatch3', 'swatch4'] as const).map((key) => (
              <label key={key}>
                <input
                  type="color"
                  value={draft[key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="gallery__submit">
            Save to gallery
          </button>
        </form>
      )}

      <ul className="gallery__grid">
        {directions.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className="gallery__card"
              onClick={() => onSelect(d.id)}
              style={
                {
                  '--card-a': d.swatches[0],
                  '--card-b': d.swatches[1],
                  '--card-c': d.swatches[2],
                  '--card-d': d.swatches[3],
                } as React.CSSProperties
              }
            >
              <div className="gallery__swatches" aria-hidden>
                {d.swatches.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </div>
              <div className="gallery__card-body">
                <span className={`gallery__status gallery__status--${d.status}`}>
                  {d.status}
                </span>
                <h2>{d.name}</h2>
                <p>{d.tagline}</p>
                <dl className="gallery__meta">
                  <div>
                    <dt>Mood</dt>
                    <dd>{d.mood}</dd>
                  </div>
                  <div>
                    <dt>Fonts</dt>
                    <dd>{d.fonts}</dd>
                  </div>
                </dl>
                <span className="gallery__enter">Enter flow →</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
