"""
Basic LangGraph example for pfaff-designs project.
This is a minimal graph that you can extend for your AI workflows.
"""
from typing import TypedDict
from langgraph.graph import StateGraph, END


class GraphState(TypedDict):
    """State for the graph"""
    message: str
    result: str


def process_node(state: GraphState) -> GraphState:
    """Process the input message"""
    return {
        **state,
        "result": f"Processed: {state.get('message', '')}"
    }


def create_graph():
    """Create and return the graph"""
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("process", process_node)
    
    # Set entry point
    workflow.set_entry_point("process")
    
    # Add edges
    workflow.add_edge("process", END)
    
    return workflow.compile()


# Export the graph
graph = create_graph()

