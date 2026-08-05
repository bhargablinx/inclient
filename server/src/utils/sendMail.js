import { resend } from "./resend.js";

const sendMail = async (userMail, subject, html) => {
    const response = await resend.emails.send({
        from: "InClient <onboarding@mail.bhargab.me>",
        to: userMail,
        subject,
        html,
    });

    return response;
};

export { sendMail };
