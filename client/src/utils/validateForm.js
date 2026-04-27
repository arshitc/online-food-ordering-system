const validateForm = (values, requiredFields) => {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!values[field]) {
      errors[field] = `${field} is required`;
    }
  });

  if (values.email && !/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = "Please enter a valid email";
  }

  if (values.password && values.password.length < 6) {
    errors.password = "Password should be at least 6 characters";
  }

  return errors;
};

export default validateForm;

