// Layout dedicado: ignora a sidebar do admin e usa tela cheia.
export default function AoVivoLayout({ children }: { children: React.ReactNode }) {
  return <div className="-mx-8 -my-8">{children}</div>;
}
