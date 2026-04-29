import { useState } from 'react';

export function useObdRegionState() {
  const [regionVisible, setRegionVisible] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const openTask = () => {
    setRegionVisible(true);
    setTaskOpen(true);
  };

  const closeTask = () => setTaskOpen(false);

  const hideRegionTask = () => {
    setTaskOpen(false);
    setRegionVisible(false);
  };

  const toggleRegion = () => {
    setRegionVisible((current) => {
      if (current) {
        setTaskOpen(false);
      }
      return !current;
    });
  };

  return {
    regionVisible,
    taskOpen,
    setRegionVisible,
    openTask,
    closeTask,
    hideRegionTask,
    toggleRegion,
  };
}
