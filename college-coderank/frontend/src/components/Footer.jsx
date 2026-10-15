import { Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span className="footer-brand">
          <img src="/college_logo.png" alt="Rungta University Logo" className="footer-logo-img" />
          Rungta International Skills University · College CodeRank
        </span>
        <span className="footer-dsc-tag">
          <Sparkles size={13} className="footer-dsc-icon" />
          Presented by <strong>DATA SCIENCE CLUB</strong>
        </span>
      </div>
      <div className="footer-right">
        <span>Empowering student coders &amp; algorithmic excellence</span>
        <span className="footer-credit">
          Initiative by <strong>Data Science Club</strong> · Made with <Heart size={12} className="footer-heart-icon" /> for campus coders
        </span>
      </div>
    </footer>
  );
}