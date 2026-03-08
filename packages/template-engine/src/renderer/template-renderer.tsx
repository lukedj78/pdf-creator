import type { Template, Element } from "../schema/types"
import { resolveProps, resolvePointer, evaluateVisible } from "../utils/data-binding"
import type { ResolveContext } from "../utils/data-binding"
import {
  TextElement,
  HeadingElement,
  ImageElement,
  LinkElement,
  TableElement,
  ViewElement,
  RowElement,
  ColumnElement,
  SpacerElement,
  DividerElement,
  ListElement,
  PageNumberElement,
  DocumentElement,
  PageElement,
} from "../elements"

type RenderElementProps = {
  elementId: string
  element: Element
  template: Template
  ctx: ResolveContext
  scale?: number
}

function RenderElement({ elementId, element, template, ctx, scale }: RenderElementProps) {
  // Visibility check
  if (element.visible) {
    if (!evaluateVisible(element.visible as { $state: string; eq: unknown }, ctx)) {
      return null
    }
  }

  // Resolve expressions in props
  const resolvedProps = resolveProps(element.props, ctx)

  // Render children helper
  const renderChildren = (childCtx?: ResolveContext) => {
    return element.children.map((childId) => {
      const child = template.elements[childId]
      if (!child) return null
      return (
        <RenderElement
          key={childId}
          elementId={childId}
          element={child}
          template={template}
          ctx={childCtx ?? ctx}
          scale={scale}
        />
      )
    })
  }

  // Handle repeat
  if (element.repeat) {
    const array = resolvePointer(ctx.state, element.repeat.statePath)
    if (!Array.isArray(array)) return null

    return (
      <>
        {array.map((item, index) => {
          const itemCtx: ResolveContext = {
            state: ctx.state,
            item: typeof item === "object" && item !== null ? item as Record<string, unknown> : {},
            index,
          }
          const itemProps = resolveProps(element.props, itemCtx)

          return (
            <RenderElementInner
              key={element.repeat!.key ? String((item as Record<string, unknown>)?.[element.repeat!.key] ?? index) : String(index)}
              element={element}
              resolvedProps={itemProps}
              template={template}
              ctx={itemCtx}
              scale={scale}
              renderChildren={() => renderChildren(itemCtx)}
            />
          )
        })}
      </>
    )
  }

  return (
    <RenderElementInner
      element={element}
      resolvedProps={resolvedProps}
      template={template}
      ctx={ctx}
      scale={scale}
      renderChildren={() => renderChildren()}
    />
  )
}

function RenderElementInner({
  element,
  resolvedProps,
  template,
  ctx,
  scale,
  renderChildren,
}: {
  element: Element
  resolvedProps: Record<string, unknown>
  template: Template
  ctx: ResolveContext
  scale?: number
  renderChildren: () => React.ReactNode
}) {
  switch (element.type) {
    case "Document":
      return <DocumentElement props={resolvedProps as any}>{renderChildren()}</DocumentElement>
    case "Page":
      return <PageElement props={resolvedProps as any} scale={scale}>{renderChildren()}</PageElement>
    case "View":
      return <ViewElement props={resolvedProps as any}>{renderChildren()}</ViewElement>
    case "Row":
      return <RowElement props={resolvedProps as any}>{renderChildren()}</RowElement>
    case "Column":
      return <ColumnElement props={resolvedProps as any}>{renderChildren()}</ColumnElement>
    case "Text":
      return <TextElement props={resolvedProps as any} />
    case "Heading":
      return <HeadingElement props={resolvedProps as any} />
    case "Image":
      return <ImageElement props={resolvedProps as any} />
    case "Link":
      return <LinkElement props={resolvedProps as any} />
    case "Table":
      return <TableElement props={resolvedProps as any} />
    case "List":
      return <ListElement props={resolvedProps as any} />
    case "Divider":
      return <DividerElement props={resolvedProps as any} />
    case "Spacer":
      return <SpacerElement props={resolvedProps as any} />
    case "PageNumber":
      return <PageNumberElement props={resolvedProps as any} />
    default:
      return null
  }
}

export type TemplateRendererProps = {
  template: Template
  className?: string
  scale?: number
}

export function TemplateRenderer({
  template,
  className,
  scale = 1,
}: TemplateRendererProps) {
  const rootElement = template.elements[template.root]
  if (!rootElement) return null

  const ctx: ResolveContext = { state: template.state }

  return (
    <div className={className}>
      <RenderElement
        elementId={template.root}
        element={rootElement}
        template={template}
        ctx={ctx}
        scale={scale}
      />
    </div>
  )
}
