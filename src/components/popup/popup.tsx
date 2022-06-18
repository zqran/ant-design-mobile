import classNames from 'classnames'
import React, { useState, useRef, FC, PropsWithChildren } from 'react'
import { useUnmountedRef } from 'ahooks'
import { NativeProps, withNativeProps } from '../../utils/native-props'
import { mergeProps } from '../../utils/with-default-props'
import Mask from '../mask'
import type { MaskProps } from '../mask'
import { useLockScroll } from '../../utils/use-lock-scroll'
import {
  GetContainer,
  renderToContainer,
} from '../../utils/render-to-container'
import { useSpring, animated } from '@react-spring/web'
import {
  PropagationEvent,
  withStopPropagation,
} from '../../utils/with-stop-propagation'
import { ShouldRender } from '../../utils/should-render'

const classPrefix = `adm-popup`

export type PopupProps = PropsWithChildren<{
  afterClose?: () => void
  afterShow?: () => void
  bodyClassName?: string
  bodyStyle?: React.CSSProperties
  destroyOnClose?: boolean
  forceRender?: boolean
  getContainer?: GetContainer
  mask?: boolean
  maskClassName?: string
  maskStyle?: MaskProps['style']
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onMaskClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  position?: 'bottom' | 'top' | 'left' | 'right'
  stopPropagation?: PropagationEvent[]
  visible?: boolean
}> &
  NativeProps<'--z-index'>

const defaultProps = {
  position: 'bottom',
  visible: false,
  getContainer: () => document.body,
  mask: true,
  stopPropagation: ['click'],
}

export const Popup: FC<PopupProps> = p => {
  const props = mergeProps(defaultProps, p)

  const bodyCls = classNames(
    `${classPrefix}-body`,
    props.bodyClassName,
    `${classPrefix}-body-position-${props.position}`
  )

  const ref = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState(props.visible)
  useLockScroll(ref, active)

  const unmountedRef = useUnmountedRef()
  const { percent } = useSpring({
    percent: props.visible ? 0 : 100,
    config: {
      precision: 0.1,
      mass: 0.4,
      tension: 300,
      friction: 30,
    },
    onStart: () => {
      setActive(true)
    },
    onRest: () => {
      if (unmountedRef.current) return
      setActive(props.visible)
      if (props.visible) {
        props.afterShow?.()
      } else {
        props.afterClose?.()
      }
    },
  })

  const node = withStopPropagation(
    props.stopPropagation,
    withNativeProps(
      props,
      <div
        className={classPrefix}
        onClick={props.onClick}
        style={{ display: active ? undefined : 'none' }}
      >
        {props.mask && (
          <Mask
            visible={props.visible}
            onMaskClick={props.onMaskClick}
            className={props.maskClassName}
            style={props.maskStyle}
            disableBodyScroll={false}
            stopPropagation={props.stopPropagation}
          />
        )}
        <animated.div
          className={bodyCls}
          style={{
            ...props.bodyStyle,
            transform: percent.to(v => {
              if (props.position === 'bottom') {
                return `translate(0, ${v}%)`
              }
              if (props.position === 'top') {
                return `translate(0, -${v}%)`
              }
              if (props.position === 'left') {
                return `translate(-${v}%, 0)`
              }
              if (props.position === 'right') {
                return `translate(${v}%, 0)`
              }
              return 'none'
            }),
          }}
          ref={ref}
        >
          {props.children}
        </animated.div>
      </div>
    )
  )

  return (
    <ShouldRender
      active={active}
      forceRender={props.forceRender}
      destroyOnClose={props.destroyOnClose}
    >
      {renderToContainer(props.getContainer, node)}
    </ShouldRender>
  )
}
