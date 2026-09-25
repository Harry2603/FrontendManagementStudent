export const getCreateTeacherError = (error) => {
  if (!error.response) {
    return { form: "Unable to connect to the server. Please try again." };
  }
  if (error.response.status === 409) {
    return { email: "This email is already in use." };
  }
  return { form: "Unable to create the teacher account. Please try again." };
};
