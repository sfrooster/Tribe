// --------------------------------------------------------------------------------------------------------------------
// <copyright file="DefaultRoute.cs" company="Hewlett-Packard">
//   Copyright © 2014 Hewlett-Packard
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

namespace App.Tribe.Routing
{
    using System.Web.Routing;

    public class DefaultRoute : Route
    {
        public DefaultRoute()
            : base("{*path}", new DefaultRouteHandler())
        {
            this.RouteExistingFiles = false;
        }
    }
}
