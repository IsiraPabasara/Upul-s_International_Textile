"use client";
import axiosInstance from "@/app/utils/axiosInstance";
import { useState } from "react";
import { usePageTitle } from "@/app/hooks/usePageTitle";

export default function ContactForm() {
  usePageTitle('Contact Us', 'Get in touch with our team');
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    comment: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      await axiosInstance.post("/api/contact", formData, {
        isPublic: true,
      } as any);

      setStatus("success");
      setFormData({ name: "", phoneNumber: "", email: "", comment: "" });
    } catch (error: any) {
      setStatus("error");

      const backendMessage = error.response?.data?.message;
      setErrorMessage(
        backendMessage || error.message || "Something went wrong.",
      );
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-3xl mx-auto p-12 border border-black rounded-none text-center bg-white font-outfit my-12">
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-4 text-black">
          Message Sent
        </h3>
        <p className="text-xs text-neutral-600 mb-8 leading-relaxed">
          Thank you for reaching out to Upul International. We have received
          your message and will get back to you shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-xs uppercase font-bold tracking-wider text-black underline hover:text-neutral-600 transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 font-outfit text-black mt-8">
      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* LEFT SIDE - FORM (Takes up 2/3 of the space) */}
        <div className="lg:col-span-2">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">
              Send us an email
            </h2>
            <p className="text-sm text-neutral-600">
              Ask us anything! We're here to help.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm text-neutral-800 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-none p-3 text-sm outline-none focus:border-black transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-neutral-800 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-none p-3 text-sm outline-none focus:border-black transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-neutral-800 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-none p-3 text-sm outline-none focus:border-black transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-neutral-800 mb-2">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                name="comment"
                required
                rows={6}
                value={formData.comment}
                onChange={handleChange}
                className="w-full border border-neutral-300 rounded-none p-3 text-sm outline-none focus:border-black resize-y transition-colors bg-transparent"
              ></textarea>
            </div>

            {status === "error" && (
              <p className="text-xs font-bold text-black bg-neutral-100 p-3 border-l-2 border-black">
                Error: {errorMessage}
              </p>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={status === "loading"}
                className="bg-black text-white font-bold uppercase tracking-[0.2em] py-4 px-12 text-xs rounded-none transition-colors hover:bg-neutral-800 disabled:bg-neutral-400"
              >
                {status === "loading" ? "SENDING..." : "SUBMIT"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE - DETAILS (Takes up 1/3 of the space) */}
        <div className="lg:col-span-1 lg:pl-8 lg:border-l lg:border-neutral-100 flex flex-col space-y-10 bg-neutral-50/50 p-6 lg:bg-transparent lg:p-0">
          {/* Live Help Section */}
          <div>
            <h3 className="text-xl font-bold text-black mb-4">Live Help</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              If you have an issue or question that requires immediate
              assistance, you can reach out directly. If we aren't available,
              drop us an email to the left and we will get back to you within 24
              hours!
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-neutral-700">
              {/* Phone Icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-black"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Call Us: 076 818 7582</span>
            </div>

            <div className="flex items-center space-x-3 text-sm text-neutral-700">
              {/* Email Icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-black"
              >
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              <a
                href="mailto:upultailors.site@gmail.com"
                className="hover:underline"
              >
                upultailors.site@gmail.com
              </a>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-6 pt-2">
            <div>
              <h4 className="text-sm font-bold text-black mb-2">
                Bandarawela Branch
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                UPUL TAILORS (PVT) LTD
                  <br />
                Haputhale Road,
                <br />
                Bandarawela, Sri Lanka
              </p>
              <div className="flex items-center space-x-3 text-sm text-neutral-700">
                <span>Call Us: 077 849 2307</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-black mb-2">
                Ratnapura Branch
              </h4>
              <p className="text-sm text-neutral-600 leading-relaxed">
                No. 249, Bandaranayake Mawatha
                <br />
                (Moragahayata),
                <br />
                Ratnapura, Sri Lanka
              </p>
              <div className="flex items-center space-x-3 text-sm text-neutral-700">
                <span>Call Us: 077 444 3445</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
