import { Link } from 'react-router-dom';

export const LinkButton = ({ link, variant = "solid", className: passedClassName }: { link: any, variant?: "solid" | "outline" | "underline", className?: string }) => {
  if (!link?.label || !link?.url) return null;
  
  const variants = {
    solid: "bg-brick-copper hover:bg-white text-charcoal shadow-sm hover:shadow-md px-6 py-3",
    outline: "bg-transparent border border-brick-copper text-brick-copper hover:bg-brick-copper hover:text-charcoal shadow-sm hover:shadow-md px-6 py-3",
    underline: "bg-transparent border-b border-brick-copper text-brick-copper hover:text-white px-0 py-1 shadow-none hover:shadow-none translate-y-0 hover:translate-y-0"
  };

  const baseClass = "inline-block font-bold uppercase text-[10px] tracking-widest transition-all duration-300 hover:-translate-y-0.5 active:scale-95 active:translate-y-0";
  const variantClass = variants[variant] || variants.solid;
  const finalClass = passedClassName || `${baseClass} ${variantClass}`;
  
  const isPopupType = link.type === 'popup' || (typeof link.url === 'string' && link.url.startsWith('popup:'));
  if (isPopupType) {
    const popupId = typeof link.url === 'string' && link.url.startsWith('popup:') 
      ? link.url.replace('popup:', '') 
      : link.url;

    const triggerPopup = (e: React.MouseEvent) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-global-popup', { detail: { popupId } }));
    };
    return (
      <button onClick={triggerPopup} className={finalClass}>
        {link.label}
      </button>
    );
  }

  if (link.type === 'internal') {
    const toUrl = link.url === '/' || link.url.startsWith('/')
      ? link.url
      : `/p/${link.url}`;
    return (
      <Link to={toUrl} className={finalClass}>
        {link.label}
      </Link>
    );
  }
  
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={finalClass}>
      {link.label}
    </a>
  );
};
