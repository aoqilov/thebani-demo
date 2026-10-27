import { useState } from 'react'
import { LuChevronRight, LuFolder, LuFolderOpen } from 'react-icons/lu'
import { cn } from '@/lib/cn'

export interface TreeNode {
  id: number | string
  label: string
  count?: number
  children?: TreeNode[]
}

interface Props {
  nodes: TreeNode[]
  selectedId: number | string | null
  onSelect: (id: number | string) => void
}

function Node({ node, depth, selectedId, onSelect }: { node: TreeNode; depth: number } & Omit<Props, 'nodes'>) {
  const [open, setOpen] = useState(depth < 1)
  const hasChildren = !!node.children?.length
  const selected = selectedId === node.id
  const Icon = hasChildren && open ? LuFolderOpen : LuFolder

  return (
    <div>
      <div
        onClick={() => { onSelect(node.id); if (hasChildren) setOpen(true) }}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={cn('flex cursor-pointer select-none items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition', selected ? 'bg-primary/10 font-semibold text-primary' : 'text-park-text3 hover:bg-park-bgHover')}
      >
        <button
          type="button"
          aria-label="Развернуть"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
          className={cn('flex h-4 w-4 items-center justify-center text-park-textMuted', !hasChildren && 'invisible')}
        >
          <LuChevronRight size={13} className={cn('transition-transform', open && 'rotate-90')} />
        </button>
        <Icon size={15} className={selected ? 'text-primary' : 'text-warning'} />
        <span className="flex-1 truncate">{node.label}</span>
        {node.count !== undefined && <span className="text-xs text-park-textMuted">{node.count}</span>}
      </div>
      {hasChildren && open && node.children!.map((c) => <Node key={c.id} node={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />)}
    </div>
  )
}

/** Дерево групп (как «Номенклатура» в iiko). */
export function CusTreeView({ nodes, selectedId, onSelect }: Props) {
  return <div className="space-y-0.5">{nodes.map((n) => <Node key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={onSelect} />)}</div>
}
