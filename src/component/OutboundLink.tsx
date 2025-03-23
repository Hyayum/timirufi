import Link from "next/link";

const OutboundLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
  <Link href={href} target="_blank" rel="noopener noreferrer" passHref style={{ textDecoration: "none", color: "rgba(0, 0, 0, 0.87)" }}>
    {children}
  </Link>
);

export default OutboundLink;