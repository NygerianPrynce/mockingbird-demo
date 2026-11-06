import icon from '../assets/mockingbird-icon.svg'

export function BirdIcon({ size = 34 }: { size?: number }) {
  return <img src={icon} width={size} height={size} alt="" aria-hidden="true" />
}
export function Logo() {
  return (
    <a className="brand" href="#/profile" aria-label="Mockingbird home">
      <BirdIcon />
      <span><span className="word">Mockingbird</span><small>Help is one call away.</small></span>
    </a>
  )
}
