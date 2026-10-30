interface SpinnerProps {
  size?: number
  label?: string
}

/** Small inline spinner that inherits the current text colour. */
const Spinner = ({ size = 12, label = 'Loading' }: SpinnerProps) => (
  <span
    role="status"
    aria-label={label}
    className="spinner"
    style={{ width: size, height: size }}
  />
)

export default Spinner
