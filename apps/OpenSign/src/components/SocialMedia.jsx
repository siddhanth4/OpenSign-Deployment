import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

const SocialMedia = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 text-xs">
      {/* Social Media Links Section - Centered with Larger Icons */}
      <div className="flex flex-row justify-center items-center gap-4 text-2xl">
        <NavLink
          to="https://legaldataforensic.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          <i aria-hidden="true" className="fa-light fa-globe"></i>
          <span className="fa-sr-only">Website</span>
        </NavLink>

        <NavLink
          to="https://www.linkedin.com/company/legal-data-forensic/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          <i aria-hidden="true" className="fa-brands fa-linkedin"></i>
          <span className="fa-sr-only">LinkedIn</span>
        </NavLink>

        <NavLink
          to="https://www.instagram.com/legaldataforensic"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          <i aria-hidden="true" className="fa-brands fa-instagram"></i>
          <span className="fa-sr-only">Instagram</span>
        </NavLink>

        <NavLink
          to="https://api.whatsapp.com/send?phone=918766618976"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          <i aria-hidden="true" className="fa-brands fa-whatsapp"></i>
          <span className="fa-sr-only">WhatsApp</span>
        </NavLink>
      </div>

      {/* Office Address and Contact Information */}
      <div className="text-[11px] text-base-content text-center max-w-[280px] leading-tight mt-1">
        <p className="font-semibold">{t("Office Address")}:</p>
        <p>202, Balwant Apartment, Plot 18, Central Excise Colony, Near Chhatrapati Square, Nagpur, Maharashtra – 440015</p>
        
        <p className="font-semibold mt-1">{t("Contact us")}:</p>
        <a href="tel:+917773900082" className="op-link op-link-primary font-medium">
          +91 7773900082
        </a>
      </div>
    </div>
  );
};

export default SocialMedia;