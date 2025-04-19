import { motion } from "framer-motion";

export const Greeting = () => {
  return (
    <motion.div
      key="welcome"
      className="max-w-3xl mx-auto flex flex-col justify-center"
      style={{ marginTop: '25vh' }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.3 }}
    >
      <div className="text-center mb-10">
        <h1 className="text-2xl font-medium">Hi I'm IMI, your AI co-creator</h1>
        <h2 className="text-lg text-muted-foreground mt-1">What do you want to work on?</h2>
      </div>
    </motion.div>
  );
};
