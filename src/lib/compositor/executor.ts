import type { CompositorGraph, CompositorNode, NodeConnection } from './schema'
import type { CompositorFrame, NodeInputs } from './frame'
import { processNode } from './nodes/process'

function findMediaOut(graph: CompositorGraph): string | undefined {
  if (graph.outputNodeId) return graph.outputNodeId
  return graph.nodes.find((n) => n.type === 'MediaOut')?.id
}

function buildAdjacency(graph: CompositorGraph): Map<string, string[]> {
  const adj = new Map<string, string[]>()
  for (const n of graph.nodes) adj.set(n.id, [])
  for (const c of graph.connections) {
    adj.get(c.fromNodeId)?.push(c.toNodeId)
  }
  return adj
}

function topologicalOrder(graph: CompositorGraph): CompositorNode[] {
  const inDegree = new Map<string, number>()
  for (const n of graph.nodes) inDegree.set(n.id, 0)
  for (const c of graph.connections) {
    inDegree.set(c.toNodeId, (inDegree.get(c.toNodeId) ?? 0) + 1)
  }
  const roots = graph.nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0)
  const order: CompositorNode[] = []
  const queue = [...roots]
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))

  while (queue.length) {
    const node = queue.shift()!
    order.push(node)
    for (const c of graph.connections) {
      if (c.fromNodeId !== node.id) continue
      const deg = (inDegree.get(c.toNodeId) ?? 1) - 1
      inDegree.set(c.toNodeId, deg)
      if (deg === 0) {
        const next = byId.get(c.toNodeId)
        if (next) queue.push(next)
      }
    }
  }

  if (order.length < graph.nodes.length) {
    const seen = new Set(order.map((n) => n.id))
    for (const n of graph.nodes) {
      if (!seen.has(n.id)) order.push(n)
    }
  }
  return order
}

function gatherInputs(
  node: CompositorNode,
  connections: NodeConnection[],
  cache: Map<string, NodeInputs>,
): NodeInputs {
  const inputs: NodeInputs = {}
  const incoming = connections.filter((c) => c.toNodeId === node.id)

  for (const conn of incoming) {
    const src = cache.get(conn.fromNodeId)
    if (!src) continue
    const fromNode = conn.fromNodeId
    void fromNode

    const port = node.inputs.find((p) => p.id === conn.toPortId)
    const label = port?.label?.toLowerCase() ?? ''

    if (label.includes('foreground') || label === 'from' || label === 'input a') {
      inputs.foreground = src.video
    } else if (label.includes('background') || label === 'to' || label === 'input b') {
      inputs.background = src.video
    } else if (port?.dataType === 'mask') {
      inputs.mask = src.video
    } else if (port?.dataType === 'depth' || label.includes('depth') || label.includes('exr')) {
      inputs.depth = src.depth ?? src.video
      inputs.exr = src.exr
    } else {
      inputs.video = src.video
    }
  }

  return inputs
}

export async function executeCompositorGraph(
  graph: CompositorGraph,
  options?: { mediaUrls?: Record<string, string> },
): Promise<CompositorFrame> {
  if (!graph.nodes.length) {
    throw new Error('Compositor graph is empty')
  }

  const order = topologicalOrder(graph)
  const cache = new Map<string, NodeInputs>()

  for (const node of order) {
    if (node.type === 'MediaIn' && options?.mediaUrls?.[node.id]) {
      node.params = { ...node.params, sourceUrl: options.mediaUrls[node.id] }
    }
    const inputs = gatherInputs(node, graph.connections, cache)
    const outputs = await processNode(node, inputs)
    cache.set(node.id, outputs)
  }

  const outId = findMediaOut(graph)
  const last = outId ? cache.get(outId) : cache.get(order[order.length - 1]?.id ?? '')
  const frame = last?.video
  if (!frame?.rgba?.length) {
    throw new Error('Compositor graph produced no output frame')
  }
  return frame
}

export async function executeCompositorGraphToPng(
  graph: CompositorGraph,
  options?: { mediaUrls?: Record<string, string> },
): Promise<Buffer> {
  const frame = await executeCompositorGraph(graph, options)
  const buf = frame.rgba
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) {
    return buf
  }
  const sharpMod = await import('sharp')
  const sharp = sharpMod.default ?? sharpMod
  return sharp(buf, { raw: { width: frame.width, height: frame.height, channels: 4 } })
    .png()
    .toBuffer()
}
