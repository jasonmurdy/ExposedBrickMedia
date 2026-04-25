import { Link } from 'react-router-dom';

export const LinkButton = ({ link, className: passedClassName }: { link: any, className?: string }) => {
  if (!link?.label || !link?.url) return null;
  
  const defaultClassName = "inline-block px-6 py-3 bg-brick-copper hover:bg-white text-charcoal font-bold uppercase text-[10px] tracking-widest transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 shadow-sm hover:shadow-md";
  const finalClass = passedClassName || defaultClassName;
  
  if (link.type === 'internal') {
    return (
      <Link to={link.url === '/' ? '/' : `/p/${link.url}`} className={finalClass}>
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
