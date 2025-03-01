import React, { Component, createRef, RefObject } from 'react';

// Define prop types for the component
interface ColumnResizerProps {
    disabled?: boolean;
    minWidth?: number;
    maxWidth?: number | null;
    defaultWidth?: number;
    className?: string;
    id?: number | string;
    rowSpan?: number;
    colSpan?: number;
    resizeStart?: () => void;
    resizeEnd?: (width: number) => void;
}

// Define state types for the component
interface ColumnResizerState {
    dragging: boolean;
    mouseX: number;
    startPos: number;
    startWidthPrev: number;
    lastDraggedWidth: number;
    draggedCol: number | string | null;
}

export default class ColumnResizer extends Component<ColumnResizerProps, ColumnResizerState> {
    // Create a ref to access the DOM element
    private resizeRef: RefObject<HTMLTableCellElement>;

    // Define default props
    static defaultProps = {
        disabled: false,
        minWidth: 0,
        className: "",
    };

    constructor(props: ColumnResizerProps) {
        super(props);

        // Initialize state
        this.state = {
            dragging: false,
            mouseX: 0,
            startPos: 0,
            startWidthPrev: 0,
            lastDraggedWidth: 0,
            draggedCol: null
        };

        // Create ref
        this.resizeRef = createRef();

        // Bind methods
        this.startDrag = this.startDrag.bind(this);
        this.endDrag = this.endDrag.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    startDrag(): void {
        if (this.props.disabled) {
            return;
        }

        // Set dragging state and store initial values
        this.setState({
            dragging: true,
            draggedCol: this.props.id ?? null,
            startPos: this.state.mouseX,
            startWidthPrev: this.resizeRef.current?.previousElementSibling?.clientWidth || 0
        });

        // Call resizeStart callback if provided
        if (this.props.resizeStart && this.props.id === this.state.draggedCol) {
            this.props.resizeStart();
        }
    }

    endDrag(): void {
        if (this.props.disabled) {
            return;
        }

        // Call resizeEnd callback if provided
        if (this.props.resizeEnd && this.state.draggedCol === this.props.id) {
            this.props.resizeEnd(this.state.lastDraggedWidth);
        }

        // Reset dragging state
        this.setState({
            dragging: false,
            draggedCol: null
        });
    }

    onMouseMove(e: MouseEvent | TouchEvent): void {
        if (this.props.disabled) {
            return;
        }

        // Get mouse position
        const mouseX = 'touches' in e ? e.touches[0].screenX : (e as MouseEvent).screenX;
        this.setState({ mouseX });

        if (!this.state.dragging) {
            return;
        }

        const ele = this.resizeRef.current;
        if (!ele?.previousElementSibling) return;

        // Calculate new width
        const moveDiff = this.state.startPos - mouseX;
        let newPrev = this.state.startWidthPrev - moveDiff;

        // Apply min/max width constraints
        if (
            (!this.props.minWidth || newPrev >= this.props.minWidth) && 
            (!this.props.maxWidth || newPrev <= this.props.maxWidth)
        ) {
            const prevSibling = ele.previousElementSibling as HTMLElement;
            prevSibling.style.width = `${newPrev}px`;
            prevSibling.style.minWidth = `${newPrev}px`;
            prevSibling.style.maxWidth = `${newPrev}px`;
            prevSibling.style.setProperty('--column_resize_before_width', `${newPrev}px`);
            this.setState({ lastDraggedWidth: newPrev });
        }
    }

    componentDidMount(): void {
        const ele = this.resizeRef.current;
        if (!ele?.previousElementSibling) return;

        const prevSibling = ele.previousElementSibling as HTMLElement;

        // Set initial width if provided
        if (this.props.defaultWidth) {
            prevSibling.style.minWidth = `${this.props.defaultWidth}px`;
            prevSibling.style.width = `${this.props.defaultWidth}px`;
            prevSibling.style.maxWidth = `${this.props.defaultWidth}px`;
            prevSibling.style.setProperty('--column_resize_before_width', `${this.props.defaultWidth}px`);
        } else if (this.props.minWidth) {
            prevSibling.style.minWidth = `${this.props.minWidth}px`;
            prevSibling.style.width = `${this.props.minWidth}px`;
            prevSibling.style.maxWidth = `${this.props.minWidth}px`;
            prevSibling.style.setProperty('--column_resize_before_width', `${this.props.minWidth}px`);
        }

        if (this.props.disabled) {
            return;
        }

        // Add event listeners
        this.addEventListenersToDocument();
    }

    componentWillUnmount(): void {
        if (this.props.disabled) {
            return;
        }

        // Remove event listeners
        this.removeEventListenersFromDocument();
    }

    componentDidUpdate(prevProps: ColumnResizerProps): void {
        // Handle disabled prop changes
        if (prevProps.disabled && !this.props.disabled) {
            this.addEventListenersToDocument();
        }

        if (!prevProps.disabled && this.props.disabled) {
            this.removeEventListenersFromDocument();
        }
    }

    private addEventListenersToDocument(): void {
        document.addEventListener('mousemove', this.onMouseMove as (e: Event) => void);
        document.addEventListener('mouseup', this.endDrag);
        document.addEventListener('touchmove', this.onMouseMove as (e: Event) => void);
        document.addEventListener('touchend', this.endDrag);
    }

    private removeEventListenersFromDocument(): void {
        document.removeEventListener('mousemove', this.onMouseMove as (e: Event) => void);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchmove', this.onMouseMove as (e: Event) => void);
        document.removeEventListener('touchend', this.endDrag);
    }

    render(): React.ReactNode {
        const style: React.CSSProperties = {
            userSelect: 'none'
        };

        if (!this.props.disabled) {
            style.cursor = 'ew-resize';
        }

        if (this.props.className === "") {
            style.width = '6px';
            style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }

        return (
            <th 
                ref={this.resizeRef}
                style={style}
                role="columnheader"
                aria-disabled={this.props.disabled}
                rowSpan={this.props.rowSpan || 1}
                colSpan={this.props.colSpan || 1}
                className={`column_resizer_own_class ${this.props.disabled ? "disabled_column_resize" : ""} ${this.props.className}`}
                onMouseDown={!this.props.disabled ? this.startDrag : undefined}
                onTouchStart={!this.props.disabled ? this.startDrag : undefined}
            />
        );
    }
}