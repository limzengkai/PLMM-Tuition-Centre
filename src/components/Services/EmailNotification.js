import React, { useRef, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const EmailNotification = ({ recipient, subject, message }) => {
  const form = useRef();

  useEffect(() => {
    // Set values for hidden inputs
    form.current.subject.value = subject;
    form.current.user_email.value = recipient;
    form.current.message.value = message;
  }, [recipient, subject, message]);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm('service_g8jhn5v', 'template_2xsif5u', form.current, '4yLQbkRQXDcBu1389')
      .then((result) => {
          console.log(result.text);
          // Optionally, you can handle success actions here, such as showing a success message
      }, (error) => {
          console.log(error.text);
          // Optionally, you can handle error actions here, such as showing an error message
      });

    // Clear the form after sending the email
    form.current.reset();
  };

  return (
    <form ref={form} onSubmit={sendEmail}>
      <input type="hidden" name="subject" ref={(input) => form.current.subject = input} />
      <input type="hidden" name="user_email" ref={(input) => form.current.user_email = input} />
      <textarea name="message" ref={(input) => form.current.message = input} />
      <input type="submit" value="Send" />
    </form>
  );
};

export default EmailNotification;
