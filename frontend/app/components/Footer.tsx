import { Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        
        {/* Left text */}
        <p>
          Made by <span className="text-zinc-400">Aditya Garg</span>
        </p>

        {/* Social icons */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AdiiGarg"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition"
          >
            <Github size={14} />
          </a>

          <a
            href="https://www.linkedin.com/in/aditya-garg-043637343"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-300 transition"
          >
            <Linkedin size={14} />
          </a>

          <a
            href="mailto:adiiigarg16@gmail.com"
            className="hover:text-zinc-300 transition"
          >
            <Mail size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
