import { Spacer } from "@nextui-org/spacer";

export function DotSpacer({ space = 3 }: { space?: number }) {
  return (
    <>
      <Spacer x={space} />
      <div className="size-1.5 bg-default-500 dark:bg-primary-400 rounded-full"></div>
      <Spacer x={space} />
    </>
  );
}
