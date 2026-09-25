export const FACE_FRAME_MESSAGES = Object.freeze({
  Success: "Valid face",
  NoFaceDetected:
    "No face detected. Please look directly at the camera.",
  MultipleFacesDetected:
    "Only one face may appear in the frame.",
  FaceTooSmall: "Please move your face closer to the camera.",
  TooDark: "Your face is too dark. Please improve the lighting.",
  TooBright:
    "The lighting is too bright. Please avoid direct light.",
  TooBlurry: "The image is blurry. Please keep the camera steady.",
  FaceTooTilted: "Please keep your head straighter.",
  AlignmentFailed:
    "Unable to align your face. Please look directly at the camera.",
  EmbeddingCreationFailed:
    "Unable to process the face in this image. Please capture it again.",
  InvalidImage: "Invalid image. Please capture it again.",
  NoCompatibleCredential:
    "No compatible Face ID was found for verification.",
  BelowMatchThreshold:
    "The face does not match the registered Face ID.",
  InsufficientMargin:
    "The recognition result is inconclusive. Please try again.",
  DifferentIdentity:
    "The frames do not appear to show the same person. Please try again.",
  InsufficientConsensus:
    "The frames did not produce a consistent result. Please try again.",
  MatchedStudentUnavailable:
    "The recognized student account is currently unavailable.",
});

export const getFaceFrameMessage = (status) =>
  FACE_FRAME_MESSAGES[status] ??
  "Unable to process the face image. Please capture it again.";

const getProblem = (error) =>
  error?.response?.data && typeof error.response.data === "object"
    ? error.response.data
    : {};

export const getFaceLoginFailure = (error) => {
  const problem = getProblem(error);
  const frames = Array.isArray(problem.frames) ? problem.frames : [];

  if (!error?.response) {
    return {
      message: "Unable to connect to the server. Please try again.",
      frames,
    };
  }

  if (problem.code === "InsufficientMatchingFrames") {
    return {
      message:
        "Not enough frames matched the same Face ID. Please try again.",
      frames,
    };
  }

  if (problem.code === "FaceVerificationFailed") {
    return {
      message: "Unable to verify your face. Please try again.",
      frames,
    };
  }

  if (error.response.status === 400) {
    return {
      message: "The three submitted face images are invalid. Please try again.",
      frames,
    };
  }

  return {
    message: "Face sign-in failed. Please try again.",
    frames,
  };
};

export const getFaceManagementError = (error) => {
  const problem = getProblem(error);

  if (!error?.response) {
    return "Unable to connect to the server. Please try again.";
  }

  if (problem.code === "FaceAlreadyRegistered") {
    return "This face has already been registered.";
  }

  if (error.response.status === 401) {
    return "The password is incorrect or your session has expired.";
  }

  if (error.response.status === 404) {
    return "The Face ID registration session was not found or has expired.";
  }

  if (error.response.status === 400) {
    return "Invalid Face ID request. Please check your input and try again.";
  }

  return "Unable to process Face ID. Please try again.";
};
