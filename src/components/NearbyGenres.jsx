import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getRelatedGenres } from '../utils/nearest'
import './NearbyGenres.css'

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

function GenreList({ items, onSelect }) {
  return (
    <motion.ul
      className="related__list"
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.05 }}
    >
      {items.map(({ genre: g, similarity }) => (
        <motion.li key={g.slug} variants={itemVariants}>
          <motion.button
            className="related__row"
            onClick={() => onSelect(g)}
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <span className="related__dot" style={{ backgroundColor: g.color }} />
            <span className="related__name">{g.name}</span>
            <span className="related__pct">{similarity}%</span>
          </motion.button>
        </motion.li>
      ))}
    </motion.ul>
  )
}

export function NearbyGenres({ genre, allGenres, onSelect }) {
  const { nearest, farthest } = useMemo(
    () => getRelatedGenres(genre, allGenres, 10),
    [genre, allGenres],
  )

  return (
    <div className="related">
      <div className="related__col">
        <h3 className="related__title">close</h3>
        <GenreList items={nearest} onSelect={onSelect} />
      </div>
      <div className="related__col">
        <h3 className="related__title">far</h3>
        <GenreList items={farthest} onSelect={onSelect} />
      </div>
    </div>
  )
}
