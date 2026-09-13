import { motion as Motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4
};

const PageTransition = ({ children }) => {
  return (
    <Motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </Motion.div>
  );
};

export default PageTransition;
