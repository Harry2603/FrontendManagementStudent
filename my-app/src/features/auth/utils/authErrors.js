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
  if (error.response.status === 400) {
    const data = error.response.data;
    const message =
      data?.message || data?.title || data?.error || data?.detail;

    return {
      form: message || "The registration information is invalid.",
    };
  }
  if (error.response.status === 404) {
    return {
      form: "Registration endpoint was not found. Please check the API URL.",
    };
  }
  return { form: "Registration failed. Please try again." };
};
