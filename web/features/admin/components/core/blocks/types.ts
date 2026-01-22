import { Block } from "@/types/cms";

export interface BlockEditorProps {
  block: Block;
  onChange: (props: Record<string, any>) => void;
}
