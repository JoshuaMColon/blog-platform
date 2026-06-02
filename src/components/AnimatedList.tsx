import { motion } from 'framer-motion'

interface AnimatedListProps {
  children: React.ReactNode[]
}

const AnimatedList = ({ children }: AnimatedListProps) => {
  return (
    <>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: 'easeOut' }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}

export default AnimatedList