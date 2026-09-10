import { useCountUp } from '../lib/useCountUp'

type AnimatedNumberProps = {
  value: number
  format: (value: number) => string
  duration?: number
}

export function AnimatedNumber({ value, format, duration }: AnimatedNumberProps) {
  const current = useCountUp(value, duration)
  return <>{format(current)}</>
}
