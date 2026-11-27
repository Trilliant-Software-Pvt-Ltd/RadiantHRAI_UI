
import { motion, useReducedMotion } from "framer-motion";

const PageTransition = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: shouldReduceMotion ? 0 : 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        opacity: {
          duration: 0.48,
          ease: "easeOut",
        },
        y: {
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
      style={{
        width: "100%",
        minWidth: 0,
        position: "relative",
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
