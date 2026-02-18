
import React, { startTransition, MouseEvent } from 'react';
import { Link, LinkProps, useNavigate, useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { prefetchRoute, loaders } from '../utils/routeLoaders';

// Configure NProgress
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

interface TransitionLinkProps extends LinkProps {
    prefetchKey?: keyof typeof loaders;
    className?: string;
    children: React.ReactNode;
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export const TransitionLink: React.FC<TransitionLinkProps> = ({
    to,
    children,
    prefetchKey,
    onClick,
    ...props
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (onClick) onClick(e);

        if (location.pathname === to) return;

        NProgress.start();

        startTransition(() => {
            navigate(to);
            NProgress.done();
        });
    };

    const handleMouseEnter = () => {
        if (prefetchKey) {
            prefetchRoute(prefetchKey);
        }
    };

    return (
        <a
            href={to.toString()}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            {...props}
        >
            {children}
        </a>
    );
};
