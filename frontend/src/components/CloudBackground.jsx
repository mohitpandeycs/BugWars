import Cloud from './Cloud'

function CloudBackground({ clouds = [] }) {
    return (
        <>
            {clouds.map((cloud) => (
                <Cloud
                    key={cloud.id}
                    top={cloud.top}
                    left={cloud.left}
                    size={cloud.size}
                    opacity={cloud.opacity}
                    shape={cloud.shape}
                    animation={cloud.animation}
                />
            ))}
        </>
    )
}

export default CloudBackground