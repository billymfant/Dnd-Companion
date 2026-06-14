import PortraitPicker from '../PortraitPicker.jsx'
import { StepHeading } from './RaceStep.jsx'

// Creation step — choose a preset portrait or upload a custom one (optional).
export default function PortraitStep({ choices, update }) {
  return (
    <div>
      <StepHeading title="Choose a Portrait" subtitle="Pick a face for your hero — or upload your own. (Optional.)" />
      {choices.avatarUrl && (
        <div className="flex justify-center mb-4">
          <img src={choices.avatarUrl} alt="Selected portrait" className="w-24 h-24 rounded-2xl object-cover border-2 border-gold bg-ink" />
        </div>
      )}
      <PortraitPicker value={choices.avatarUrl || ''} onChange={(url) => update({ avatarUrl: url })} />
    </div>
  )
}
