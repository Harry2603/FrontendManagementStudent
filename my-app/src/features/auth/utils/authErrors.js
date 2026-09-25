export const getLoginError = (error) => {
  if (!error.response) {
    return { form: "Unable to connect to the server. Please try again." };
  }
  if (error.response.status === 401) {
    return { form: "Incorrect email or password." };
  }
  return { form: "Sign in failed. Please try again." };
};

export const getRegisterError = (error) => {
  if (!error.response) {
    return { form: "Unable to connect to the server. Please try again." };
  }
  if (error.response.status === 409) {
    return { email: "This email is already in use." };
  }
  return { form: "Registration failed. Please try again." };
};
