import React from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

const Recorder: React.FC = () => {
  // Logic extracted to custom hook for better separation of concerns
  useAudioRecorder();

  // This component is purely logical and renders nothing
  // It effectively attaches the keyboard listeners to the document
  return null;
};

export default Recorder;
